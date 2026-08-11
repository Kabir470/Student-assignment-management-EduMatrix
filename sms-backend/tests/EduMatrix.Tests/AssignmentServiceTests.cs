using System;
using System.Threading.Tasks;
using EduMatrix.Application.Assignments;
using EduMatrix.Application.Assignments.DTOs;
using EduMatrix.Application.Common;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Enums;
using EduMatrix.Domain.Interfaces;
using Moq;
using Xunit;

namespace EduMatrix.Tests.Assignments;

public class AssignmentServiceTests
{
    private readonly Mock<IAssignmentRepository> _assignmentRepoMock = new();
    private readonly Mock<ICourseRepository> _courseRepoMock = new();
    private readonly Mock<IUserRepository> _userRepoMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly AssignmentService _assignmentService;

    public AssignmentServiceTests()
    {
        _assignmentService = new AssignmentService(
            _assignmentRepoMock.Object,
            _courseRepoMock.Object,
            _userRepoMock.Object,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task CreateAsync_ShouldFail_WhenTeacherNotAssignedToCourse()
    {
        // Arrange
        var teacherId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var otherTeacherId = Guid.NewGuid();

        _currentUserServiceMock.Setup(x => x.UserId).Returns(teacherId);

        _courseRepoMock.Setup(x => x.GetByIdAsync(courseId))
            .ReturnsAsync(new Course
            {
                Id = courseId,
                TeacherId = otherTeacherId // Assigned to another teacher
            });

        var request = new CreateAssignmentRequest
        {
            CourseId = courseId,
            Title = "Math Quiz",
            Description = "Algebra test",
            DueDate = DateTimeOffset.UtcNow.AddDays(7),
            TotalMarks = 100
        };

        // Act
        var result = await _assignmentService.CreateAsync(request);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal("You do not have permission to add assignments to this course.", result.ErrorMessage);
    }

    [Fact]
    public async Task CreateAsync_ShouldSucceed_WhenTeacherOwnsCourse()
    {
        // Arrange
        var teacherId = Guid.NewGuid();
        var courseId = Guid.NewGuid();

        _currentUserServiceMock.Setup(x => x.UserId).Returns(teacherId);

        _courseRepoMock.Setup(x => x.GetByIdAsync(courseId))
            .ReturnsAsync(new Course
            {
                Id = courseId,
                TeacherId = teacherId
            });

        _assignmentRepoMock.Setup(x => x.CreateAsync(It.IsAny<Assignment>()))
            .ReturnsAsync(Guid.NewGuid());

        var request = new CreateAssignmentRequest
        {
            CourseId = courseId,
            Title = "Physics Exam",
            Description = "Newtonian mechanics",
            DueDate = DateTimeOffset.UtcNow.AddDays(7),
            TotalMarks = 100,
            Status = AssignmentStatus.Published
        };

        // Act
        var result = await _assignmentService.CreateAsync(request);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotEqual(Guid.Empty, result.Value);
    }
}
