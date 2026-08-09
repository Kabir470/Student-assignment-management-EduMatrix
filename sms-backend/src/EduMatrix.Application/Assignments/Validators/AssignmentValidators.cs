using FluentValidation;
using EduMatrix.Application.Assignments.DTOs;

namespace EduMatrix.Application.Assignments.Validators;

public class CreateAssignmentRequestValidator : AbstractValidator<CreateAssignmentRequest>
{
    public CreateAssignmentRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Description).NotEmpty();
        RuleFor(x => x.CourseId).NotEmpty();
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.DueDate).NotEmpty();
        RuleFor(x => x.TotalMarks).InclusiveBetween(1, 1000);
    }
}

public class UpdateAssignmentRequestValidator : AbstractValidator<UpdateAssignmentRequest>
{
    public UpdateAssignmentRequestValidator()
    {
        RuleFor(x => x.Title).MaximumLength(255).When(x => !string.IsNullOrEmpty(x.Title));
        RuleFor(x => x.TotalMarks).InclusiveBetween(1, 1000).When(x => x.TotalMarks.HasValue);
    }
}
