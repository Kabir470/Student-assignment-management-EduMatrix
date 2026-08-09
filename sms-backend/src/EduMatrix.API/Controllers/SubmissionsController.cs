using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EduMatrix.Application.Submissions;
using EduMatrix.Application.Submissions.DTOs;
using EduMatrix.Application.Common;
using EduMatrix.Domain.Enums;
using EduMatrix.Domain.Interfaces;
using EduMatrix.Domain.Entities;

namespace EduMatrix.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubmissionsController : ControllerBase
{
    private readonly SubmissionService _submissionService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ISubmissionCommentRepository _commentRepository;
    private readonly IUserRepository _userRepository;

    public SubmissionsController(
        SubmissionService submissionService,
        ICurrentUserService currentUserService,
        ISubmissionCommentRepository commentRepository,
        IUserRepository userRepository)
    {
        _submissionService = submissionService;
        _currentUserService = currentUserService;
        _commentRepository = commentRepository;
        _userRepository = userRepository;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> GetSubmissions([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] Guid? assignmentId = null, [FromQuery] SubmissionStatus? status = null)
    {
        Guid? teacherScopeId = _currentUserService.UserRole == "Teacher" ? _currentUserService.UserId : null;
        var result = await _submissionService.GetSubmissionsAsync(page, pageSize, assignmentId, null, status, teacherScopeId);
        return Ok(result.Value);
    }

    [HttpGet("my-submissions")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMySubmissions([FromQuery] int page = 1, [FromQuery] int pageSize = 100, [FromQuery] Guid? assignmentId = null, [FromQuery] SubmissionStatus? status = null)
    {
        var studentId = _currentUserService.UserId;
        var result = await _submissionService.GetSubmissionsAsync(page, pageSize, assignmentId, studentId, status);
        return Ok(result.Value);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _submissionService.GetByIdAsync(id);
        if (!result.IsSuccess) return NotFound(new { message = result.ErrorMessage });
        return Ok(result.Value);
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Create([FromBody] CreateSubmissionRequest request)
    {
        var result = await _submissionService.CreateAsync(request);
        if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
        return CreatedAtAction(nameof(GetById), new { id = result.Value }, new { id = result.Value });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateSubmissionRequest request)
    {
        var result = await _submissionService.UpdateAsync(id, request);
        if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _submissionService.DeleteAsync(id);
        if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
        return NoContent();
    }

    [HttpPatch("{id}/grade")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Grade(Guid id, [FromBody] GradeSubmissionRequest request)
    {
        var result = await _submissionService.GradeAsync(id, request);
        if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
        return NoContent();
    }

    // ─── Comments ────────────────────────────────────────────────────────────

    [HttpGet("{id}/comments")]
    public async Task<IActionResult> GetComments(Guid id)
    {
        var comments = await _commentRepository.GetBySubmissionIdAsync(id);
        return Ok(comments);
    }

    [HttpPost("{id}/comments")]
    public async Task<IActionResult> AddComment(Guid id, [FromBody] AddCommentRequest request)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        var user = await _userRepository.GetByIdAsync(userId.Value);
        if (user == null) return Unauthorized();

        var comment = new SubmissionComment
        {
            SubmissionId = id,
            AuthorId = userId.Value,
            AuthorName = $"{user.FirstName} {user.LastName}",
            AuthorRole = _currentUserService.UserRole?.ToLower() ?? "student",
            Content = request.Content,
        };

        var commentId = await _commentRepository.CreateAsync(comment);
        comment.Id = commentId;
        return Ok(comment);
    }

    [HttpDelete("{id}/comments/{commentId}")]
    public async Task<IActionResult> DeleteComment(Guid id, Guid commentId)
    {
        await _commentRepository.DeleteAsync(commentId);
        return NoContent();
    }
}

public class AddCommentRequest
{
    public string Content { get; set; } = string.Empty;
}
