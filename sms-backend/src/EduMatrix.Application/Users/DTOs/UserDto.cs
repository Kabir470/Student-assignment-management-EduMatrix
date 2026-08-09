using System;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Enums;

namespace EduMatrix.Application.Users.DTOs;

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? InstitutionalId { get; set; }
    public UserRole Role { get; set; }
    public bool IsActive { get; set; }

    public static UserDto FromUser(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            InstitutionalId = user.InstitutionalId,
            Role = user.Role,
            IsActive = user.IsActive
        };
    }
}
