using System;
using System.Threading.Tasks;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Common;
using EduMatrix.Domain.Enums;

namespace EduMatrix.Domain.Interfaces;

public interface ISubmissionRepository
{
    Task<Submission?> GetByIdAsync(Guid id);
    Task<Submission?> GetByAssignmentAndStudentAsync(Guid assignmentId, Guid studentId);
    Task<PagedResult<Submission>> GetSubmissionsAsync(int page, int pageSize, Guid? assignmentId, Guid? studentId, SubmissionStatus? status, Guid? teacherId = null);
    Task<Guid> CreateAsync(Submission submission);
    Task UpdateAsync(Submission submission);
    Task DeleteAsync(Guid id);
}
