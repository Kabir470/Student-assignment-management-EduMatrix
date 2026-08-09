using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

using EduMatrix.Application.Users;
using EduMatrix.Application.Courses;
using EduMatrix.Application.AssignmentPosts;
using EduMatrix.Application.Assignments;
using EduMatrix.Application.Submissions;
using System.Reflection;

namespace EduMatrix.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        services.AddScoped<UserService>();
        services.AddScoped<CourseService>();
        services.AddScoped<AssignmentPostService>();
        services.AddScoped<AssignmentService>();
        services.AddScoped<SubmissionService>();
        services.AddScoped<EduMatrix.Application.Announcements.AnnouncementService>();

        return services;
    }
}
