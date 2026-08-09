using FluentValidation;
using EduMatrix.Application.Courses.DTOs;

namespace EduMatrix.Application.Courses.Validators;

public class CreateCourseRequestValidator : AbstractValidator<CreateCourseRequest>
{
    public CreateCourseRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Code).NotEmpty().MaximumLength(20);
        RuleFor(x => x.TeacherId).NotEmpty();
        RuleFor(x => x.Status).IsInEnum();
    }
}

public class UpdateCourseRequestValidator : AbstractValidator<UpdateCourseRequest>
{
    public UpdateCourseRequestValidator()
    {
        RuleFor(x => x.Title).MaximumLength(255).When(x => !string.IsNullOrEmpty(x.Title));
        RuleFor(x => x.Code).MaximumLength(20).When(x => !string.IsNullOrEmpty(x.Code));
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue);
    }
}
