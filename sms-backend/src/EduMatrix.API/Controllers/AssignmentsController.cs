using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EduMatrix.Application.Assignments;
using EduMatrix.Application.Assignments.DTOs;
using EduMatrix.Application.Common;
using EduMatrix.Domain.Enums;

namespace EduMatrix.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssignmentsController : ControllerBase
{
    private readonly AssignmentService _assignmentService;
    private readonly ICurrentUserService _currentUserService;

    public AssignmentsController(AssignmentService assignmentService, ICurrentUserService currentUserService)
    {
        _assignmentService = assignmentService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> GetAssignments([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] Guid? courseId = null, [FromQuery] AssignmentStatus? status = null)
    {
        Guid? teacherId = _currentUserService.UserRole == "Teacher" ? _currentUserService.UserId : null;
        var result = await _assignmentService.GetAssignmentsAsync(page, pageSize, search, courseId, teacherId, null, status);
        return Ok(result.Value);
    }

    [HttpGet("my-assignments")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyAssignments([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] Guid? courseId = null)
    {
        var studentId = _currentUserService.UserId;
        var result = await _assignmentService.GetAssignmentsAsync(page, pageSize, search, courseId, null, studentId, null);
        return Ok(result.Value);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _assignmentService.GetByIdAsync(id);
        if (!result.IsSuccess) return NotFound(new { message = result.ErrorMessage });
        return Ok(result.Value);
    }

    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Create([FromBody] CreateAssignmentRequest request)
    {
        var result = await _assignmentService.CreateAsync(request);
        if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
        return CreatedAtAction(nameof(GetById), new { id = result.Value }, new { id = result.Value });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAssignmentRequest request)
    {
        var result = await _assignmentService.UpdateAsync(id, request);
        if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _assignmentService.DeleteAsync(id);
        if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
        return NoContent();
    }

    [HttpPatch("{id}/publish")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Publish(Guid id)
    {
        var result = await _assignmentService.PublishAsync(id);
        if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
        return NoContent();
    }

    [HttpPatch("{id}/archive")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Archive(Guid id)
    {
        var result = await _assignmentService.ArchiveAsync(id);
        if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
        return NoContent();
    }
}
