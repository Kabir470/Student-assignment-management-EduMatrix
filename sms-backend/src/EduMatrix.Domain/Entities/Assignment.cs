using System;
using EduMatrix.Domain.Common;
using EduMatrix.Domain.Enums;

namespace EduMatrix.Domain.Entities;

public class Assignment : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid CourseId { get; set; }
    public Guid TeacherId { get; set; }
    public AssignmentStatus Status { get; set; } = AssignmentStatus.Draft;
    public DateTimeOffset DueDate { get; set; }
    public int TotalMarks { get; set; } = 100;
    public string? AllowedFileTypes { get; set; }
    public int? MaxFileSizeMb { get; set; }
    public string? AttachmentUrl { get; set; }
    public bool AllowLateSubmissions { get; set; } = true;
}
