using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.DependencyInjection;
using EduMatrix.Domain.Interfaces;

namespace EduMatrix.API.Services;

public class SupabaseRoleClaimsTransformation : IClaimsTransformation
{
    private readonly IServiceScopeFactory _scopeFactory;

    public SupabaseRoleClaimsTransformation(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        // Prevent infinite loops / multiple transformations
        if (principal.HasClaim(c => c.Type == "RoleTransformationCompleted"))
            return principal;

        var clone = principal.Clone();
        var newIdentity = new ClaimsIdentity();

        // Ensure we mark it as transformed
        newIdentity.AddClaim(new Claim("RoleTransformationCompleted", "true"));

        // Get the Sub claim (which is the user ID in Supabase)
        var subClaim = principal.FindFirst(ClaimTypes.NameIdentifier) ?? principal.FindFirst("sub");
        if (subClaim != null && System.Guid.TryParse(subClaim.Value, out var userId))
        {
            // We must use a scope because IClaimsTransformation is a transient/singleton injected by the framework,
            // but IUserRepository uses scoped DatabaseContext.
            using var scope = _scopeFactory.CreateScope();
            var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
            
            var user = await userRepository.GetByIdAsync(userId);
            if (user != null)
            {
                newIdentity.AddClaim(new Claim(ClaimTypes.Role, user.Role.ToString()));
                
                // Add NameIdentifier if missing
                if (!principal.HasClaim(c => c.Type == ClaimTypes.NameIdentifier))
                {
                    newIdentity.AddClaim(new Claim(ClaimTypes.NameIdentifier, userId.ToString()));
                }
            }
        }

        clone.AddIdentity(newIdentity);
        return clone;
    }
}
