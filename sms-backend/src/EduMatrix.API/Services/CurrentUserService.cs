using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using EduMatrix.Application.Common;

namespace EduMatrix.API.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var userId = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            return userId != null ? Guid.Parse(userId) : null;
        }
    }

    public string? UserRole
    {
        get
        {
            var claims = _httpContextAccessor.HttpContext?.User?.FindAll(ClaimTypes.Role);
            if (claims != null)
            {
                foreach (var claim in claims)
                {
                    if (claim.Value == "Student" || claim.Value == "Teacher" || claim.Value == "Admin")
                        return claim.Value;
                }
            }
            return _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Role);
        }
    }
    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}
