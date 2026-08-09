using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EduMatrix.Domain.Common;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Interfaces;
using EduMatrix.Application.Courses.DTOs;

namespace EduMatrix.Application.Courses;

public class CourseService
{
    private readonly ICourseRepository _courseRepository;
    private readonly IUserRepository _userRepository;

    public CourseService(ICourseRepository courseRepository, IUserRepository userRepository)
    {
        _courseRepository = courseRepository;
        _userRepository = userRepository;
    }

    public async Task<Result<PagedResult<CourseDto>>> GetCoursesAsync(int page, int pageSize, string? search, Guid? teacherId, Guid? studentId)
    {
        var result = await _courseRepository.GetCoursesAsync(page, pageSize, search, teacherId, studentId);
        var dtos = new List<CourseDto>();

        foreach (var course in result.Data)
        {
            var teacher = await _userRepository.GetByIdAsync(course.TeacherId);
            var studentIds = (await _courseRepository.GetEnrolledStudentIdsAsync(course.Id)).ToList();
            dtos.Add(CourseDto.FromCourse(course, teacher != null ? $"{teacher.FirstName} {teacher.LastName}" : "Unknown", studentIds));
        }

        return Result<PagedResult<CourseDto>>.Success(new PagedResult<CourseDto>(dtos, result.TotalCount, result.Page, result.PageSize));
    }

    public async Task<Result<CourseDto>> GetByIdAsync(Guid id)
    {
        var course = await _courseRepository.GetByIdAsync(id);
        if (course == null) return Result<CourseDto>.Failure("Course not found.");

        var teacher = await _userRepository.GetByIdAsync(course.TeacherId);
        var studentIds = (await _courseRepository.GetEnrolledStudentIdsAsync(course.Id)).ToList();
        
        return Result<CourseDto>.Success(CourseDto.FromCourse(course, teacher != null ? $"{teacher.FirstName} {teacher.LastName}" : "Unknown", studentIds));
    }

    public async Task<Result<Guid>> CreateAsync(CreateCourseRequest request)
    {
        var teacher = await _userRepository.GetByIdAsync(request.TeacherId);
        if (teacher == null || teacher.Role != Domain.Enums.UserRole.Teacher)
            return Result<Guid>.Failure("Invalid teacher selected.");

        var course = new Course
        {
            Title = request.Title,
            Code = request.Code,
            Description = request.Description,
            TeacherId = request.TeacherId,
            Status = request.Status
        };

        var id = await _courseRepository.CreateAsync(course);
        return Result<Guid>.Success(id);
    }

    public async Task<Result> UpdateAsync(Guid id, UpdateCourseRequest request)
    {
        var course = await _courseRepository.GetByIdAsync(id);
        if (course == null) return Result.Failure("Course not found.");

        if (request.TeacherId.HasValue && request.TeacherId.Value != course.TeacherId)
        {
            var teacher = await _userRepository.GetByIdAsync(request.TeacherId.Value);
            if (teacher == null || teacher.Role != Domain.Enums.UserRole.Teacher)
                return Result.Failure("Invalid teacher selected.");
            course.TeacherId = request.TeacherId.Value;
        }

        if (!string.IsNullOrEmpty(request.Title)) course.Title = request.Title;
        if (!string.IsNullOrEmpty(request.Code)) course.Code = request.Code;
        if (request.Description != null) course.Description = request.Description;
        if (request.Status.HasValue) course.Status = request.Status.Value;

        await _courseRepository.UpdateAsync(course);
        return Result.Success();
    }

    public async Task<Result> DeleteAsync(Guid id)
    {
        var course = await _courseRepository.GetByIdAsync(id);
        if (course == null) return Result.Failure("Course not found.");

        await _courseRepository.DeleteAsync(id);
        return Result.Success();
    }

    public async Task<Result> EnrollStudentAsync(Guid id, Guid studentId)
    {
        var course = await _courseRepository.GetByIdAsync(id);
        if (course == null) return Result.Failure("Course not found.");

        var student = await _userRepository.GetByIdAsync(studentId);
        if (student == null || student.Role != Domain.Enums.UserRole.Student)
            return Result.Failure("Invalid student selected.");

        var isEnrolled = await _courseRepository.IsStudentEnrolledAsync(id, studentId);
        if (isEnrolled) return Result.Failure("Student is already enrolled.");

        await _courseRepository.EnrollStudentAsync(id, studentId);
        return Result.Success();
    }

    public async Task<Result> RemoveStudentAsync(Guid id, Guid studentId)
    {
        var isEnrolled = await _courseRepository.IsStudentEnrolledAsync(id, studentId);
        if (!isEnrolled) return Result.Failure("Student is not enrolled in this course.");

        await _courseRepository.RemoveStudentAsync(id, studentId);
        return Result.Success();
    }
}
