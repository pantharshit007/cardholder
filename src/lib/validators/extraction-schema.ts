/** Use only portable structured-output keywords; validate field formats locally. */
export function createExtractionJsonSchema(categoryIds: string[]) {
  const nullableString = { type: ['string', 'null'] }
  return {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'phone', 'email', 'company', 'categoryId'],
    properties: {
      name: nullableString,
      phone: nullableString,
      email: nullableString,
      company: nullableString,
      categoryId: categoryIds.length
        ? { type: ['string', 'null'], enum: [...categoryIds, null] }
        : { type: 'null' },
    },
  }
}
