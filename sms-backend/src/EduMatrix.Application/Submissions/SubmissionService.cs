using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using EduMatrix.Domain.Common;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Interfaces;
using EduMatrix.Application.Submissions.DTOs;
using EduMatrix.Application.Common;

namespace EduMatrix.Application.Submissions;

public class SubmissionService
{
    private readonly ISubmissionRepository _submissionRepository;
    private readonly IAssignmentRepository _assignmentRepository;
    private readonly ICourseRepository _courseRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUserService;

    public SubmissionService(
        ISubmissionRepository submissionRepository, 
        IAssignmentRepository assignmentRepository, 
        ICourseRepository courseRepository,
        IUserRepository userRepository, 
        ICurrentUserService currentUserService)
    {
        _submissionRepository = submissionRepository;
        _assignmentRepository = assignmentRepository;
        _courseRepository = courseRepository;
        _userRepository = userRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<PagedResult<SubmissionDto>>> GetSubmissionsAsync(int page, int pageSize, Guid? assignmentId, Guid? studentId, Domain.Enums.SubmissionStatus? status, Guid? teacherId = null)
    {
        var result = await _submissionRepository.GetSubmissionsAsync(page, pageSize, assignmentId, studentId, status, teacherId);
        var dtos = new List<SubmissionDto>();

        foreach (var submission in result.Data)
        {
            var assignment = await _assignmentRepository.GetByIdAsync(submission.AssignmentId);
            var course = assignment != null ? await _courseRepository.GetByIdAsync(assignment.CourseId) : null;
            var student = await _userRepository.GetByIdAsync(submission.StudentId);
            var gradedBy = submission.GradedById.HasValue ? await _userRepository.GetByIdAsync(submission.GradedById.Value) : null;
            
            var links = string.IsNullOrEmpty(submission.Links) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(submission.Links);

            dtos.Add(SubmissionDto.FromSubmission(
                submission, 
                assignment?.Title ?? "Unknown", 
                course?.Id ?? Guid.Empty,
                course?.Title ?? "Unknown", 
                student != null ? $"{student.FirstName} {student.LastName}" : "Unknown",
                student?.Email ?? "Unknown",
                gradedBy != null ? $"{gradedBy.FirstName} {gradedBy.LastName}" : "",
                links
            ));
        }

        return Result<PagedResult<SubmissionDto>>.Success(new PagedResult<SubmissionDto>(dtos, result.TotalCount, result.Page, result.PageSize));
    }

    public async Task<Result<SubmissionDto>> GetByIdAsync(Guid id)
    {
        var submission = await _submissionRepository.GetByIdAsync(id);
        if (submission == null) return Result<SubmissionDto>.Failure("Submission not found.");

        var assignment = await _assignmentRepository.GetByIdAsync(submission.AssignmentId);
        var course = assignment != null ? await _courseRepository.GetByIdAsync(assignment.CourseId) : null;
        var student = await _userRepository.GetByIdAsync(submission.StudentId);
        var gradedBy = submission.GradedById.HasValue ? await _userRepository.GetByIdAsync(submission.GradedById.Value) : null;
        
        var links = string.IsNullOrEmpty(submission.Links) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(submission.Links);

        return Result<SubmissionDto>.Success(SubmissionDto.FromSubmission(
            submission, 
            assignment?.Title ?? "Unknown", 
            course?.Id ?? Guid.Empty,
            course?.Title ?? "Unknown", 
            student != null ? $"{student.FirstName} {student.LastName}" : "Unknown",
            student?.Email ?? "Unknown",
            gradedBy != null ? $"{gradedBy.FirstName} {gradedBy.LastName}" : "",
            links
        ));
    }

    public async Task<Result<Guid>> CreateAsync(CreateSubmissionRequest request)
    {
        var studentId = _currentUserService.UserId;
        if (!studentId.HasValue || _currentUserService.UserRole != "Student") 
            return Result<Guid>.Failure("Unauthorized.");

        var assignment = await _assignmentRepository.GetByIdAsync(request.AssignmentId);
        if (assignment == null) return Result<Guid>.Failure("Assignment not found.");
        
        if (assignment.Status != Domain.Enums.AssignmentStatus.Published)
            return Result<Guid>.Failure("Assignment is not published.");

        var isEnrolled = await _courseRepository.IsStudentEnrolledAsync(assignment.CourseId, studentId.Value);
        if (!isEnrolled) return Result<Guid>.Failure("You are not enrolled in this course.");

        var existingSubmission = await _submissionRepository.GetByAssignmentAndStudentAsync(request.AssignmentId, studentId.Value);
        if (existingSubmission != null) return Result<Guid>.Failure("You have already submitted for this assignment.");

        var status = DateTimeOffset.UtcNow > assignment.DueDate ? Domain.Enums.SubmissionStatus.Late : Domain.Enums.SubmissionStatus.Submitted;

        var submission = new Submission
        {
            AssignmentId = request.AssignmentId,
            StudentId = studentId.Value,
            Status = status,
            TextContent = request.TextContent,
            FileUrl = request.FileUrl,
            FileName = request.FileName,
            Links = request.Links.Count > 0 ? JsonSerializer.Serialize(request.Links) : null
        };

        var id = await _submissionRepository.CreateAsync(submission);
        return Result<Guid>.Success(id);
    }

    public async Task<Result> UpdateAsync(Guid id, CreateSubmissionRequest request)
    {
        var submission = await _submissionRepository.GetByIdAsync(id);
        if (submission == null) return Result.Failure("Submission not found.");

        if (submission.StudentId != _currentUserService.UserId) return Result.Failure("You can only edit your own submissions.");
        
        if (submission.Status == Domain.Enums.SubmissionStatus.Graded) return Result.Failure("Cannot edit a graded submission.");

        submission.TextContent = request.TextContent;
        submission.FileUrl = request.FileUrl;
        submission.FileName = request.FileName;
        submission.Links = request.Links.Count > 0 ? JsonSerializer.Serialize(request.Links) : null;
        submission.SubmittedAt = DateTimeOffset.UtcNow;

        var assignment = await _assignmentRepository.GetByIdAsync(submission.AssignmentId);
        if (assignment != null && DateTimeOffset.UtcNow > assignment.DueDate)
        {
            submission.Status = Domain.Enums.SubmissionStatus.Late;
        }

        await _submissionRepository.UpdateAsync(submission);
        return Result.Success();
    }

    public async Task<Result> DeleteAsync(Guid id)
    {
        var submission = await _submissionRepository.GetByIdAsync(id);
        if (submission == null) return Result.Failure("Submission not found.");

        if (submission.StudentId != _currentUserService.UserId) return Result.Failure("You can only delete your own submissions.");
        if (submission.Status == Domain.Enums.SubmissionStatus.Graded) return Result.Failure("Cannot delete a graded submission.");

        await _submissionRepository.DeleteAsync(id);
        return Result.Success();
    }

    public async Task<Result> GradeAsync(Guid id, GradeSubmissionRequest request)
    {
        var submission = await _submissionRepository.GetByIdAsync(id);
        if (submission == null) return Result.Failure("Submission not found.");

        var teacherId = _currentUserService.UserId;
        if (!teacherId.HasValue || _currentUserService.UserRole == "Student") return Result.Failure("Unauthorized.");

        var assignment = await _assignmentRepository.GetByIdAsync(submission.AssignmentId);
        if (assignment == null) return Result.Failure("Assignment not found.");

        if (assignment.TeacherId != teacherId && _currentUserService.UserRole != "Admin")
            return Result.Failure("You can only grade submissions for your own assignments.");

        if (request.Grade < 0 || request.Grade > assignment.TotalMarks)
            return Result.Failure($"Grade must be between 0 and {assignment.TotalMarks}.");

        submission.Grade = request.Grade;
        submission.Feedback = request.Feedback;
        submission.Status = Domain.Enums.SubmissionStatus.Graded;
        submission.GradedAt = DateTimeOffset.UtcNow;
        submission.GradedById = teacherId.Value;

        await _submissionRepository.UpdateAsync(submission);
        return Result.Success();
    }
}
