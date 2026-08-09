using Microsoft.Extensions.DependencyInjection;
using EduMatrix.Domain.Interfaces;
using EduMatrix.Application.AssignmentPosts;
using EduMatrix.Infrastructure.Persistence;
using EduMatrix.Infrastructure.Repositories;

namespace EduMatrix.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton<DatabaseContext>();
        
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ICourseRepository, CourseRepository>();
        services.AddScoped<IAssignmentRepository, AssignmentRepository>();
        services.AddScoped<ISubmissionRepository, SubmissionRepository>();
        services.AddScoped<IAnnouncementRepository, AnnouncementRepository>();
        services.AddScoped<ISubmissionCommentRepository, SubmissionCommentRepository>();
        services.AddScoped<IAssignmentPostRepository, AssignmentPostRepository>();

        return services;
    }
}
