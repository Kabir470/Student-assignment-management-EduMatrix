using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EduMatrix.Application.Courses;
using EduMatrix.Application.Courses.DTOs;
using EduMatrix.Application.Common;
using EduMatrix.Domain.Interfaces;

namespace EduMatrix.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CoursesController : ControllerBase
{
    private readonly CourseService _courseService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUserRepository _userRepository;

    public CoursesController(CourseService courseService, ICurrentUserService currentUserService, IUserRepository userRepository)
    {
        _courseService = courseService;
        _currentUserService = currentUserService;
        _userRepository = userRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetCourses([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? search = null)
    {
        var role = _currentUserService.UserRole;
        Guid? teacherId = role == "Teacher" ? _currentUserService.UserId : null;
        
        var result = await _courseService.GetCoursesAsync(page, pageSize, search, teacherId, null);
        return Ok(result.Value);
    }

    [HttpGet("my-courses")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyCourses([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? search = null)
    {
        var studentId = _currentUserService.UserId;
        var result = await _courseService.GetCoursesAsync(page, pageSize, search, null, studentId);
        return Ok(result.Value);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _courseService.GetByIdAsync(id);
        if (!result.IsSuccess) return NotFound(new { message = result.ErrorMessage });
        return Ok(result.Value);
    }

    /// <summary>Get enrolled students with full details for a course</summary>
    [HttpGet("{id}/students")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> GetEnrolledStudents(Guid id)
    {
        var course = await _courseService.GetByIdAsync(id);
        if (!course.IsSuccess) return NotFound(new { message = "Course not found." });

        // Teachers can only view their own course students
        if (_currentUserService.UserRole == "Teacher" && course.Value!.TeacherId != _currentUserService.UserId)
            return Forbid();

        var studentIds = course.Value!.StudentIds;
        var students = new List<object>();
        foreach (var sid in studentIds)
        {
            var student = await _userRepository.GetByIdAsync(sid);
            if (student != null)
            {
                students.Add(new
                {
                    student.Id,
                    student.FirstName,
                    student.LastName,
                    student.Email,
                    student.IsActive,
                });
            }
        }
        return Ok(students);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateCourseRequest request)
    {
        var result = await _courseService.CreateAsync(request);
        if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
        return CreatedAtAction(nameof(GetById), new { id = result.Value }, new { id = result.Value });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCourseRequest request)
    {
        // Teachers can only update their own course (status/archive)
        if (_currentUserService.UserRole == "Teacher")
        {
            var course = await _courseService.GetByIdAsync(id);
            if (!course.IsSuccess || course.Value!.TeacherId != _currentUserService.UserId)
                return Forbid();
            // Teachers can only change status, not reassign teacher
            request.TeacherId = null;
        }

        var result = await _courseService.UpdateAsync(id, request);
        if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _courseService.DeleteAsync(id);
        if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
        return NoContent();
    }

    [HttpPost("{id}/enroll/{studentId}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> EnrollStudent(Guid id, Guid studentId)
    {
        // Teachers can only enroll in their own courses
        if (_currentUserService.UserRole == "Teacher")
        {
            var course = await _courseService.GetByIdAsync(id);
            if (!course.IsSuccess || course.Value!.TeacherId != _currentUserService.UserId)
                return Forbid();
        }

        var result = await _courseService.EnrollStudentAsync(id, studentId);
        if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
        return Ok(new { message = "Student enrolled successfully." });
    }

    [HttpDelete("{id}/enroll/{studentId}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> RemoveStudent(Guid id, Guid studentId)
    {
        // Teachers can only remove from their own courses
        if (_currentUserService.UserRole == "Teacher")
        {
            var course = await _courseService.GetByIdAsync(id);
            if (!course.IsSuccess || course.Value!.TeacherId != _currentUserService.UserId)
                return Forbid();
        }

        var result = await _courseService.RemoveStudentAsync(id, studentId);
        if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
        return NoContent();
    }
}
