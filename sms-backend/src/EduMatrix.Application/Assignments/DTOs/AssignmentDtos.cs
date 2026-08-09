using System;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Enums;

namespace EduMatrix.Application.Assignments.DTOs;

public class AssignmentDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset DueDate { get; set; }
    public int TotalMarks { get; set; }
    public string? AllowedFileTypes { get; set; }
    public int? MaxFileSizeMb { get; set; }
    public string? AttachmentUrl { get; set; }
    public bool AllowLateSubmissions { get; set; }

    public static AssignmentDto FromAssignment(Assignment assignment, string courseName = "", string teacherName = "") => new()
    {
        Id = assignment.Id,
        Title = assignment.Title,
        Description = assignment.Description,
        CourseId = assignment.CourseId,
        CourseName = courseName,
        TeacherId = assignment.TeacherId,
        TeacherName = teacherName,
        Status = assignment.Status.ToString().ToLower(),
        DueDate = assignment.DueDate,
        TotalMarks = assignment.TotalMarks,
        AllowedFileTypes = assignment.AllowedFileTypes,
        MaxFileSizeMb = assignment.MaxFileSizeMb,
        AttachmentUrl = assignment.AttachmentUrl,
        AllowLateSubmissions = assignment.AllowLateSubmissions
    };
}

public class CreateAssignmentRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid CourseId { get; set; }
    public AssignmentStatus Status { get; set; } = AssignmentStatus.Draft;
    public DateTimeOffset DueDate { get; set; }
    public int TotalMarks { get; set; } = 100;
    public string? AllowedFileTypes { get; set; }
    public int? MaxFileSizeMb { get; set; }
    public string? AttachmentUrl { get; set; }
    public bool AllowLateSubmissions { get; set; } = true;
}

public class UpdateAssignmentRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTimeOffset? DueDate { get; set; }
    public int? TotalMarks { get; set; }
    public string? AllowedFileTypes { get; set; }
    public int? MaxFileSizeMb { get; set; }
    public string? AttachmentUrl { get; set; }
    public bool? AllowLateSubmissions { get; set; }
}
