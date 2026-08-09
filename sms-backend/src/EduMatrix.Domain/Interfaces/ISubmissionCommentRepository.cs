using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduMatrix.Domain.Entities;

namespace EduMatrix.Domain.Interfaces;

public interface ISubmissionCommentRepository
{
    Task<List<SubmissionComment>> GetBySubmissionIdAsync(Guid submissionId);
    Task<Guid> CreateAsync(SubmissionComment comment);
    Task DeleteAsync(Guid id);
}
