import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions
} from "class-validator";

// Cross-field check, e.g. @IsAfter('starts_at') on ends_at.
export function IsAfter(
  property: string,
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isAfter",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];
          if (!value || !relatedValue) return true;
          return (
            new Date(value as string).getTime() >
            new Date(relatedValue as string).getTime()
          );
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          return `${args.property} must be after ${relatedPropertyName}`;
        }
      }
    });
  };
}
