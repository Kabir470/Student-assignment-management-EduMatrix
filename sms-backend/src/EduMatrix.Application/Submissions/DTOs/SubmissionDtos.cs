using System;
using System.Collections.Generic;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Enums;

namespace EduMatrix.Application.Submissions.DTOs;

public class SubmissionDto
{
    public Guid Id { get; set; }
    public Guid AssignmentId { get; set; }
    public string AssignmentTitle { get; set; } = string.Empty;
    public Guid CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset SubmittedAt { get; set; }
    public string? TextContent { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public List<string> Links { get; set; } = new();
    public decimal? Grade { get; set; }
    public string? Feedback { get; set; }
    public DateTimeOffset? GradedAt { get; set; }
    public Guid? GradedById { get; set; }
    public string? GradedByName { get; set; }

    public static SubmissionDto FromSubmission(
        Submission submission, 
        string assignmentTitle = "", 
        Guid courseId = default,
        string courseName = "",
        string studentName = "",
        string studentEmail = "",
        string gradedByName = "",
        List<string>? links = null) => new()
    {
        Id = submission.Id,
        AssignmentId = submission.AssignmentId,
        AssignmentTitle = assignmentTitle,
        CourseId = courseId,
        CourseName = courseName,
        StudentId = submission.StudentId,
        StudentName = studentName,
        StudentEmail = studentEmail,
        Status = submission.Status.ToString().ToLower(),
        SubmittedAt = submission.SubmittedAt,
        TextContent = submission.TextContent,
        FileUrl = submission.FileUrl,
        FileName = submission.FileName,
        Links = links ?? new(),
        Grade = submission.Grade,
        Feedback = submission.Feedback,
        GradedAt = submission.GradedAt,
        GradedById = submission.GradedById,
        GradedByName = gradedByName
    };
}

public class CreateSubmissionRequest
{
    public Guid AssignmentId { get; set; }
    public string? TextContent { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public List<string> Links { get; set; } = new();
}

public class GradeSubmissionRequest
{
    public decimal Grade { get; set; }
    public string? Feedback { get; set; }
}
