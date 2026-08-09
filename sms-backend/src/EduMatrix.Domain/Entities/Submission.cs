using System;
using EduMatrix.Domain.Common;
using EduMatrix.Domain.Enums;

namespace EduMatrix.Domain.Entities;

public class Submission : BaseEntity
{
    public Guid AssignmentId { get; set; }
    public Guid StudentId { get; set; }
    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;
    public DateTimeOffset SubmittedAt { get; set; } = DateTimeOffset.UtcNow;
    public string? TextContent { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public string? Links { get; set; } // JSON array of links
    public decimal? Grade { get; set; }
    public string? Feedback { get; set; }
    public DateTimeOffset? GradedAt { get; set; }
    public Guid? GradedById { get; set; }
}
