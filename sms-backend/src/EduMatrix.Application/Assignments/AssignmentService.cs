using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduMatrix.Domain.Common;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Interfaces;
using EduMatrix.Application.Assignments.DTOs;
using EduMatrix.Application.Common;

namespace EduMatrix.Application.Assignments;

public class AssignmentService
{
    private readonly IAssignmentRepository _assignmentRepository;
    private readonly ICourseRepository _courseRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUserService;

    public AssignmentService(IAssignmentRepository assignmentRepository, ICourseRepository courseRepository, IUserRepository userRepository, ICurrentUserService currentUserService)
    {
        _assignmentRepository = assignmentRepository;
        _courseRepository = courseRepository;
        _userRepository = userRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<PagedResult<AssignmentDto>>> GetAssignmentsAsync(int page, int pageSize, string? search, Guid? courseId, Guid? teacherId, Guid? studentId, Domain.Enums.AssignmentStatus? status)
    {
        var result = await _assignmentRepository.GetAssignmentsAsync(page, pageSize, search, courseId, teacherId, studentId, status);
        var dtos = new List<AssignmentDto>();

        foreach (var assignment in result.Data)
        {
            var course = await _courseRepository.GetByIdAsync(assignment.CourseId);
            var teacher = await _userRepository.GetByIdAsync(assignment.TeacherId);
            dtos.Add(AssignmentDto.FromAssignment(assignment, course?.Title ?? "Unknown", teacher != null ? $"{teacher.FirstName} {teacher.LastName}" : "Unknown"));
        }

        return Result<PagedResult<AssignmentDto>>.Success(new PagedResult<AssignmentDto>(dtos, result.TotalCount, result.Page, result.PageSize));
    }

    public async Task<Result<AssignmentDto>> GetByIdAsync(Guid id)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(id);
        if (assignment == null) return Result<AssignmentDto>.Failure("Assignment not found.");

        var course = await _courseRepository.GetByIdAsync(assignment.CourseId);
        var teacher = await _userRepository.GetByIdAsync(assignment.TeacherId);

        return Result<AssignmentDto>.Success(AssignmentDto.FromAssignment(assignment, course?.Title ?? "Unknown", teacher != null ? $"{teacher.FirstName} {teacher.LastName}" : "Unknown"));
    }

    public async Task<Result<Guid>> CreateAsync(CreateAssignmentRequest request)
    {
        var teacherId = _currentUserService.UserId;
        if (!teacherId.HasValue) return Result<Guid>.Failure("Unauthorized.");

        var course = await _courseRepository.GetByIdAsync(request.CourseId);
        if (course == null) return Result<Guid>.Failure("Course not found.");
        if (course.TeacherId != teacherId.Value) return Result<Guid>.Failure("You do not have permission to add assignments to this course.");

        var assignment = new Assignment
        {
            Title = request.Title,
            Description = request.Description,
            CourseId = request.CourseId,
            TeacherId = teacherId.Value,
            Status = request.Status,
            DueDate = request.DueDate,
            TotalMarks = request.TotalMarks,
            AllowedFileTypes = request.AllowedFileTypes,
            MaxFileSizeMb = request.MaxFileSizeMb,
            AttachmentUrl = request.AttachmentUrl,
            AllowLateSubmissions = request.AllowLateSubmissions
        };

        var id = await _assignmentRepository.CreateAsync(assignment);
        return Result<Guid>.Success(id);
    }

    public async Task<Result> UpdateAsync(Guid id, UpdateAssignmentRequest request)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(id);
        if (assignment == null) return Result.Failure("Assignment not found.");

        var teacherId = _currentUserService.UserId;
        if (assignment.TeacherId != teacherId) return Result.Failure("You do not have permission to edit this assignment.");

        if (!string.IsNullOrEmpty(request.Title)) assignment.Title = request.Title;
        if (!string.IsNullOrEmpty(request.Description)) assignment.Description = request.Description;
        if (request.DueDate.HasValue) assignment.DueDate = request.DueDate.Value;
        if (request.TotalMarks.HasValue) assignment.TotalMarks = request.TotalMarks.Value;
        if (request.AllowedFileTypes != null) assignment.AllowedFileTypes = request.AllowedFileTypes;
        if (request.MaxFileSizeMb.HasValue) assignment.MaxFileSizeMb = request.MaxFileSizeMb.Value;
        if (request.AttachmentUrl != null) assignment.AttachmentUrl = request.AttachmentUrl;
        if (request.AllowLateSubmissions.HasValue) assignment.AllowLateSubmissions = request.AllowLateSubmissions.Value;

        await _assignmentRepository.UpdateAsync(assignment);
        return Result.Success();
    }

    public async Task<Result> DeleteAsync(Guid id)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(id);
        if (assignment == null) return Result.Failure("Assignment not found.");

        var teacherId = _currentUserService.UserId;
        if (assignment.TeacherId != teacherId && _currentUserService.UserRole != "Admin") 
            return Result.Failure("You do not have permission to delete this assignment.");

        await _assignmentRepository.DeleteAsync(id);
        return Result.Success();
    }

    public async Task<Result> PublishAsync(Guid id)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(id);
        if (assignment == null) return Result.Failure("Assignment not found.");

        if (assignment.TeacherId != _currentUserService.UserId) return Result.Failure("Unauthorized.");

        assignment.Status = Domain.Enums.AssignmentStatus.Published;
        await _assignmentRepository.UpdateAsync(assignment);
        return Result.Success();
    }

    public async Task<Result> ArchiveAsync(Guid id)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(id);
        if (assignment == null) return Result.Failure("Assignment not found.");

        if (assignment.TeacherId != _currentUserService.UserId) return Result.Failure("Unauthorized.");

        assignment.Status = Domain.Enums.AssignmentStatus.Archived;
        await _assignmentRepository.UpdateAsync(assignment);
        return Result.Success();
    }
}
