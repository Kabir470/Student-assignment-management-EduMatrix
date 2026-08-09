using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EduMatrix.Application.Users;
using EduMatrix.Application.Users.DTOs;
using EduMatrix.Domain.Enums;

namespace EduMatrix.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UserService _userService;

    public UsersController(UserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] UserRole? role = null)
    {
        var result = await _userService.GetUsersAsync(page, pageSize, search, role);
        return Ok(result.Value);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();
        
        var result = await _userService.GetByIdAsync(Guid.Parse(userId));
        if (!result.IsSuccess) return NotFound(new { message = result.ErrorMessage });
        return Ok(result.Value);
    }

    [HttpGet("next-id")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetNextId([FromQuery] UserRole role = UserRole.Student)
    {
        var result = await _userService.GetNextInstitutionalIdAsync(role);
        return Ok(new { nextId = result.Value });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && userId != id.ToString())
        {
            return Forbid();
        }

        var result = await _userService.GetByIdAsync(id);
        if (!result.IsSuccess) return NotFound(new { message = result.ErrorMessage });
        return Ok(result.Value);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        var result = await _userService.CreateAsync(request);
        if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
        return CreatedAtAction(nameof(GetById), new { id = result.Value }, new { id = result.Value });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest request)
    {
        var result = await _userService.UpdateAsync(id, request);
        if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _userService.DeleteAsync(id);
        if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
        return NoContent();
    }

    [HttpPatch("{id}/toggle-active")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleActive(Guid id)
    {
        var result = await _userService.ToggleActiveAsync(id);
        if (!result.IsSuccess) return BadRequest(new { message = result.ErrorMessage });
        return NoContent();
    }
}
