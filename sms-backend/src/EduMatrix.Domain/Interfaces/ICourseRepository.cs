using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Common;

namespace EduMatrix.Domain.Interfaces;

public interface ICourseRepository
{
    Task<Course?> GetByIdAsync(Guid id);
    Task<PagedResult<Course>> GetCoursesAsync(int page, int pageSize, string? search, Guid? teacherId, Guid? studentId);
    Task<Guid> CreateAsync(Course course);
    Task UpdateAsync(Course course);
    Task DeleteAsync(Guid id);
    Task EnrollStudentAsync(Guid courseId, Guid studentId);
    Task RemoveStudentAsync(Guid courseId, Guid studentId);
    Task<bool> IsStudentEnrolledAsync(Guid courseId, Guid studentId);
    Task<IReadOnlyList<Guid>> GetEnrolledStudentIdsAsync(Guid courseId);
}
