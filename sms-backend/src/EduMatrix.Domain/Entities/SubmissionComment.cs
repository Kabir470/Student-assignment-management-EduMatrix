using System;
using EduMatrix.Domain.Common;

namespace EduMatrix.Domain.Entities;

public class SubmissionComment : BaseEntity
{
    public Guid SubmissionId { get; set; }
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorRole { get; set; } = "student";
    public string Content { get; set; } = string.Empty;
}
