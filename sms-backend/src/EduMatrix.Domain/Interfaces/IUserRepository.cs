using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Enums;
using EduMatrix.Domain.Common;

namespace EduMatrix.Domain.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByEmailAsync(string email);
    Task<PagedResult<User>> GetUsersAsync(int page, int pageSize, string? search, UserRole? role);
    Task<Guid> CreateAsync(User user);
    Task UpdateAsync(User user);
    Task DeleteAsync(Guid id);
    Task<string?> GetMaxInstitutionalIdAsync(UserRole role);
}
