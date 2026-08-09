using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EduMatrix.Application.AssignmentPosts;
using System.Security.Claims;

namespace EduMatrix.API.Controllers;

[ApiController]
[Route("api/assignments")]
[Authorize]
public class AssignmentPostsController : ControllerBase
{
    private readonly AssignmentPostService _assignmentPostService;

    public AssignmentPostsController(AssignmentPostService assignmentPostService)
    {
        _assignmentPostService = assignmentPostService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
    private string GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;

    [HttpGet("{assignmentId}/posts")]
    public async Task<IActionResult> GetPosts(Guid assignmentId)
    {
        var result = await _assignmentPostService.GetPostsForAssignmentAsync(assignmentId);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.ErrorMessage });
    }

    [HttpPost("{assignmentId}/posts")]
    public async Task<IActionResult> CreatePost(Guid assignmentId, [FromBody] CreateAssignmentPostRequest request)
    {
        var result = await _assignmentPostService.CreatePostAsync(assignmentId, GetUserId(), request.Content);
        return result.IsSuccess ? Ok(new { id = result.Value }) : BadRequest(new { message = result.ErrorMessage });
    }

    [HttpPost("posts/{postId}/comments")]
    public async Task<IActionResult> CreateComment(Guid postId, [FromBody] CreateAssignmentPostRequest request)
    {
        var result = await _assignmentPostService.CreateCommentAsync(postId, GetUserId(), request.Content);
        return result.IsSuccess ? Ok(new { id = result.Value }) : BadRequest(new { message = result.ErrorMessage });
    }

    [HttpDelete("posts/{id}")]
    public async Task<IActionResult> DeletePost(Guid id)
    {
        var result = await _assignmentPostService.DeletePostAsync(id, GetUserId(), GetUserRole());
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.ErrorMessage });
    }
}

public class CreateAssignmentPostRequest
{
    public string Content { get; set; } = string.Empty;
}
