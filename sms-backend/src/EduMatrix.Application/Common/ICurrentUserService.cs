using System;

namespace EduMatrix.Application.Common;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? UserRole { get; }
    bool IsAuthenticated { get; }
}
