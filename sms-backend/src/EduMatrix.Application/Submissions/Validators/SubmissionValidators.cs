using FluentValidation;
using EduMatrix.Application.Submissions.DTOs;

namespace EduMatrix.Application.Submissions.Validators;

public class CreateSubmissionRequestValidator : AbstractValidator<CreateSubmissionRequest>
{
    public CreateSubmissionRequestValidator()
    {
        RuleFor(x => x.AssignmentId).NotEmpty();
        // Custom rule to ensure at least one form of content is provided
        RuleFor(x => x).Must(x => !string.IsNullOrEmpty(x.TextContent) || !string.IsNullOrEmpty(x.FileUrl) || x.Links.Count > 0)
            .WithMessage("Submission must contain either text content, a file, or links.");
    }
}

public class GradeSubmissionRequestValidator : AbstractValidator<GradeSubmissionRequest>
{
    public GradeSubmissionRequestValidator()
    {
        RuleFor(x => x.Grade).GreaterThanOrEqualTo(0);
    }
}
