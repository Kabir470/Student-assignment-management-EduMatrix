using System;
using System.Collections.Generic;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Enums;

namespace EduMatrix.Application.Courses.DTOs;

public class CourseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty; // Populated from join
    public string Status { get; set; } = string.Empty;
    public List<Guid> StudentIds { get; set; } = new();

    public static CourseDto FromCourse(Course course, string teacherName = "", List<Guid>? studentIds = null) => new()
    {
        Id = course.Id,
        Title = course.Title,
        Code = course.Code,
        Description = course.Description,
        TeacherId = course.TeacherId,
        TeacherName = teacherName,
        Status = course.Status.ToString().ToLower(),
        StudentIds = studentIds ?? new()
    };
}

public class CreateCourseRequest
{
    public string Title { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid TeacherId { get; set; }
    public CourseStatus Status { get; set; } = CourseStatus.Active;
}

public class UpdateCourseRequest
{
    public string? Title { get; set; }
    public string? Code { get; set; }
    public string? Description { get; set; }
    public Guid? TeacherId { get; set; }
    public CourseStatus? Status { get; set; }
}
