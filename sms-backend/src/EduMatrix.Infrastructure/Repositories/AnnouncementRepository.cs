using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dapper;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Interfaces;
using EduMatrix.Infrastructure.Persistence;

namespace EduMatrix.Infrastructure.Repositories;

public class AnnouncementRepository : IAnnouncementRepository
{
    private readonly DatabaseContext _context;

    public AnnouncementRepository(DatabaseContext context)
    {
        _context = context;
        DefaultTypeMap.MatchNamesWithUnderscores = true;
    }

    public async Task<List<Announcement>> GetAllAsync(int limit = 20)
    {
        using var connection = _context.CreateConnection();
        const string sql = "SELECT * FROM announcements ORDER BY created_at DESC LIMIT @Limit";
        var result = await connection.QueryAsync<Announcement>(sql, new { Limit = limit });
        return result.AsList();
    }

    public async Task<Announcement?> GetByIdAsync(Guid id)
    {
        using var connection = _context.CreateConnection();
        const string sql = "SELECT * FROM announcements WHERE id = @Id";
        return await connection.QuerySingleOrDefaultAsync<Announcement>(sql, new { Id = id });
    }

    public async Task<Guid> CreateAsync(Announcement announcement)
    {
        using var connection = _context.CreateConnection();
        const string sql = @"
            INSERT INTO announcements (title, content, author_id, is_global, created_at, updated_at)
            VALUES (@Title, @Content, @AuthorId, @IsGlobal, @CreatedAt, @UpdatedAt)
            RETURNING id;";
        return await connection.ExecuteScalarAsync<Guid>(sql, new
        {
            announcement.Title,
            announcement.Content,
            announcement.AuthorId,
            announcement.IsGlobal,
            announcement.CreatedAt,
            announcement.UpdatedAt
        });
    }

    public async Task DeleteAsync(Guid id)
    {
        using var connection = _context.CreateConnection();
        const string sql = "DELETE FROM announcements WHERE id = @Id";
        await connection.ExecuteAsync(sql, new { Id = id });
    }
}
