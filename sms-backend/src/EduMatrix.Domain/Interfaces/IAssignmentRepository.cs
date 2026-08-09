using System;
using System.Threading.Tasks;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Common;
using EduMatrix.Domain.Enums;

namespace EduMatrix.Domain.Interfaces;

public interface IAssignmentRepository
{
    Task<Assignment?> GetByIdAsync(Guid id);
    Task<PagedResult<Assignment>> GetAssignmentsAsync(int page, int pageSize, string? search, Guid? courseId, Guid? teacherId, Guid? studentId, AssignmentStatus? status);
    Task<Guid> CreateAsync(Assignment assignment);
    Task UpdateAsync(Assignment assignment);
    Task DeleteAsync(Guid id);
}
