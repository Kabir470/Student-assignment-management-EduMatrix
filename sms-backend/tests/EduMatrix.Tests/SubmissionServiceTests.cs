using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduMatrix.Application.Common;
using EduMatrix.Application.Submissions;
using EduMatrix.Application.Submissions.DTOs;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Enums;
using EduMatrix.Domain.Interfaces;
using Moq;
using Xunit;

namespace EduMatrix.Tests.Submissions;

public class SubmissionServiceTests
{
    private readonly Mock<ISubmissionRepository> _submissionRepoMock = new();
    private readonly Mock<IAssignmentRepository> _assignmentRepoMock = new();
    private readonly Mock<ICourseRepository> _courseRepoMock = new();
    private readonly Mock<IUserRepository> _userRepoMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly SubmissionService _submissionService;

    public SubmissionServiceTests()
    {
        _submissionService = new SubmissionService(
            _submissionRepoMock.Object,
            _assignmentRepoMock.Object,
            _courseRepoMock.Object,
            _userRepoMock.Object,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task CreateAsync_ShouldFail_WhenUserIsNotStudent()
    {
        // Arrange
        _currentUserServiceMock.Setup(x => x.UserId).Returns(Guid.NewGuid());
        _currentUserServiceMock.Setup(x => x.UserRole).Returns("Teacher");

        var request = new CreateSubmissionRequest { AssignmentId = Guid.NewGuid() };

        // Act
        var result = await _submissionService.CreateAsync(request);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal("Unauthorized.", result.ErrorMessage);
    }

    [Fact]
    public async Task CreateAsync_ShouldFail_WhenAssignmentIsNotPublished()
    {
        // Arrange
        var studentId = Guid.NewGuid();
        var assignmentId = Guid.NewGuid();

        _currentUserServiceMock.Setup(x => x.UserId).Returns(studentId);
        _currentUserServiceMock.Setup(x => x.UserRole).Returns("Student");

        _assignmentRepoMock.Setup(x => x.GetByIdAsync(assignmentId))
            .ReturnsAsync(new Assignment
            {
                Id = assignmentId,
                Status = AssignmentStatus.Draft
            });

        var request = new CreateSubmissionRequest { AssignmentId = assignmentId };

        // Act
        var result = await _submissionService.CreateAsync(request);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal("Assignment is not published.", result.ErrorMessage);
    }

    [Fact]
    public async Task CreateAsync_ShouldFail_WhenStudentIsNotEnrolledInCourse()
    {
        // Arrange
        var studentId = Guid.NewGuid();
        var assignmentId = Guid.NewGuid();
        var courseId = Guid.NewGuid();

        _currentUserServiceMock.Setup(x => x.UserId).Returns(studentId);
        _currentUserServiceMock.Setup(x => x.UserRole).Returns("Student");

        _assignmentRepoMock.Setup(x => x.GetByIdAsync(assignmentId))
            .ReturnsAsync(new Assignment
            {
                Id = assignmentId,
                CourseId = courseId,
                Status = AssignmentStatus.Published
            });

        _courseRepoMock.Setup(x => x.IsStudentEnrolledAsync(courseId, studentId))
            .ReturnsAsync(false);

        var request = new CreateSubmissionRequest { AssignmentId = assignmentId };

        // Act
        var result = await _submissionService.CreateAsync(request);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal("You are not enrolled in this course.", result.ErrorMessage);
    }

    [Fact]
    public async Task CreateAsync_ShouldMarkSubmissionLate_WhenSubmittedAfterDueDate()
    {
        // Arrange
        var studentId = Guid.NewGuid();
        var assignmentId = Guid.NewGuid();
        var courseId = Guid.NewGuid();

        _currentUserServiceMock.Setup(x => x.UserId).Returns(studentId);
        _currentUserServiceMock.Setup(x => x.UserRole).Returns("Student");

        _assignmentRepoMock.Setup(x => x.GetByIdAsync(assignmentId))
            .ReturnsAsync(new Assignment
            {
                Id = assignmentId,
                CourseId = courseId,
                Status = AssignmentStatus.Published,
                DueDate = DateTimeOffset.UtcNow.AddDays(-1) // Passed due date
            });

        _courseRepoMock.Setup(x => x.IsStudentEnrolledAsync(courseId, studentId))
            .ReturnsAsync(true);

        _submissionRepoMock.Setup(x => x.GetByAssignmentAndStudentAsync(assignmentId, studentId))
            .ReturnsAsync((Submission?)null);

        Submission? capturedSubmission = null;
        _submissionRepoMock.Setup(x => x.CreateAsync(It.IsAny<Submission>()))
            .Callback<Submission>(s => capturedSubmission = s)
            .ReturnsAsync(Guid.NewGuid());

        var request = new CreateSubmissionRequest 
        { 
            AssignmentId = assignmentId,
            TextContent = "My late answer"
        };

        // Act
        var result = await _submissionService.CreateAsync(request);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(capturedSubmission);
        Assert.Equal(SubmissionStatus.Late, capturedSubmission.Status);
    }
}
