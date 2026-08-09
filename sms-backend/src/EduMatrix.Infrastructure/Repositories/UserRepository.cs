using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using EduMatrix.Domain.Common;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Enums;
using EduMatrix.Domain.Interfaces;
using EduMatrix.Infrastructure.Persistence;

namespace EduMatrix.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly DatabaseContext _context;

    public UserRepository(DatabaseContext context)
    {
        _context = context;
        DefaultTypeMap.MatchNamesWithUnderscores = true;
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        using var connection = _context.CreateConnection();
        const string sql = "SELECT * FROM users WHERE id = @Id";
        return await connection.QuerySingleOrDefaultAsync<User>(sql, new { Id = id });
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        using var connection = _context.CreateConnection();
        const string sql = "SELECT * FROM users WHERE email = @Email";
        return await connection.QuerySingleOrDefaultAsync<User>(sql, new { Email = email });
    }

    public async Task<PagedResult<User>> GetUsersAsync(int page, int pageSize, string? search, UserRole? role)
    {
        using var connection = _context.CreateConnection();
        
        var query = "FROM users WHERE 1=1";
        var param = new DynamicParameters();

        if (!string.IsNullOrEmpty(search))
        {
            query += " AND (first_name ILIKE @Search OR last_name ILIKE @Search OR email ILIKE @Search)";
            param.Add("Search", $"%{search}%");
        }

        if (role.HasValue)
        {
            query += " AND role = @Role::user_role";
            param.Add("Role", role.Value.ToString().ToLower());
        }

        var countSql = $"SELECT COUNT(*) {query}";
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, param);

        var dataSql = $"SELECT * {query} ORDER BY created_at DESC LIMIT @Limit OFFSET @Offset";
        param.Add("Limit", pageSize);
        param.Add("Offset", (page - 1) * pageSize);

        var data = await connection.QueryAsync<User>(dataSql, param);

        return new PagedResult<User>(data.ToList(), totalCount, page, pageSize);
    }

    public async Task<Guid> CreateAsync(User user)
    {
        using var connection = _context.CreateConnection();
        const string sql = @"
            INSERT INTO users (id, email, first_name, last_name, role, is_active, institutional_id)
            VALUES (@Id, @Email, @FirstName, @LastName, @Role::user_role, @IsActive, @InstitutionalId)
            RETURNING id;";
        
        var id = await connection.ExecuteScalarAsync<Guid>(sql, new { 
            user.Id,
            user.Email, 
            user.FirstName, 
            user.LastName, 
            Role = user.Role.ToString().ToLower(), 
            user.IsActive,
            user.InstitutionalId
        });
        
        return id;
    }

    public async Task UpdateAsync(User user)
    {
        using var connection = _context.CreateConnection();
        const string sql = @"
            UPDATE users SET 
                email = @Email,
                first_name = @FirstName,
                last_name = @LastName,
                role = @Role::user_role,
                is_active = @IsActive,
                institutional_id = @InstitutionalId
            WHERE id = @Id;";
            
        await connection.ExecuteAsync(sql, new { 
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            Role = user.Role.ToString().ToLower(),
            user.IsActive,
            user.InstitutionalId
        });
    }

    public async Task DeleteAsync(Guid id)
    {
        using var connection = _context.CreateConnection();
        const string sql = "DELETE FROM users WHERE id = @Id";
        await connection.ExecuteAsync(sql, new { Id = id });
    }

    public async Task<string?> GetMaxInstitutionalIdAsync(UserRole role)
    {
        using var connection = _context.CreateConnection();
        const string sql = @"
            SELECT MAX(institutional_id) 
            FROM users 
            WHERE role = @Role::user_role 
              AND institutional_id IS NOT NULL";
              
        return await connection.ExecuteScalarAsync<string?>(sql, new { Role = role.ToString().ToLower() });
    }
}
