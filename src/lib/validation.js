import { z } from 'zod'

export const speciesSchema = z.object({
  scientific_name: z.string().min(1, 'Scientific name is required'),
  scientific_name_without_author: z.string().min(1, 'Scientific name without author is required'),
  scientific_name_authorship: z.string().optional().nullable(),
  kingdom: z.string().default('Plantae'),
  phylum: z.string().optional().nullable(),
  class: z.string().optional().nullable(),
  order: z.string().optional().nullable(),
  family: z.string().optional().nullable(),
  genus: z.string().optional().nullable(),
  specific_epithet: z.string().optional().nullable(),
  rank: z.enum(['SPECIES', 'SUBSPECIES', 'VARIETY']).default('SPECIES'),
  taxonomic_status: z.string().optional().nullable(),
  common_names: z.array(z.string()).default([]),
  distribution_native: z.array(z.string()).default([]),
  distribution_introduced: z.array(z.string()).default([]),
  gbif_key: z.number().int().positive().optional().nullable(),
  powo_id: z.string().optional().nullable(),
  inaturalist_id: z.number().int().positive().optional().nullable(),
  ala_guid: z.string().optional().nullable(),
  vicflora_uuid: z.string().optional().nullable(),
  conservation_status: z.object({
    iucnCategory: z.string().optional().nullable(),
    authority: z.string().optional().nullable(),
    nationalStatus: z.string().optional().nullable(),
    stateStatus: z.string().optional().nullable(),
  }).default({}),
  life_form: z.string().optional().nullable(),
  height: z.string().optional().nullable(),
  flowering_season: z.string().optional().nullable(),
  habitat_notes: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  first_published: z.string().optional().nullable(),
  synonyms: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
  api_verified: z.boolean().default(false),
})

export const imageMetadataSchema = z.object({
  license: z.string().optional(),
  creator: z.string().optional(),
  organ: z.enum(['habit', 'flower', 'leaf', 'fruit', 'bark', 'seed', 'other']).optional(),
  caption: z.string().optional(),
  is_primary: z.boolean().default(false),
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  displayName: z.string().min(1, 'Display name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
