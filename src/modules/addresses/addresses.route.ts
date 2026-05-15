import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
	deletedNoContent,
	jsonBody,
	jsonCreated,
	jsonOk,
} from '@/lib/openapi-helpers';
import { forbidden, notFound, unauthorized } from '@/lib/openapi-responses';
import { CursorQuerySchema } from '@/lib/pagination';
import type { AppEnv } from '@/types/app';
import {
	AddressesOffsetQuerySchema,
	AddressesOffsetResponseSchema,
	AddressesCursorResponseSchema,
	AddressesParamsSchema,
	AddressSelectSchema,
	AddressInsertSchema,
	AddressUpdateSchema,
} from './addresses.schema';
import {
	listAddresses,
	listAddressesCursor,
	getAddress,
	createAddress,
	updateAddress,
	deleteAddress,
} from './addresses.handler';

export const listAddressesRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Addresses'],
	summary: 'List addresses (offset pagination)',
	request: { query: AddressesOffsetQuerySchema },
	responses: {
		200: jsonOk(AddressesOffsetResponseSchema),
	},
});

export const listAddressesCursorRoute = createRoute({
	method: 'get',
	path: '/cursor',
	tags: ['Addresses'],
	summary: 'List addresses (cursor pagination)',
	request: { query: CursorQuerySchema },
	responses: {
		200: jsonOk(AddressesCursorResponseSchema),
	},
});

export const getAddressRoute = createRoute({
	method: 'get',
	path: '/{id}',
	tags: ['Addresses'],
	summary: 'Get address by ID',
	request: { params: AddressesParamsSchema },
	responses: {
		200: jsonOk(AddressSelectSchema),
		404: notFound,
	},
});

export const createAddressRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Addresses'],
	summary: 'Create a new address',
	request: {
		body: jsonBody(AddressInsertSchema),
	},
	responses: {
		201: jsonCreated(AddressSelectSchema),
		401: unauthorized,
		403: forbidden,
	},
});

export const updateAddressRoute = createRoute({
	method: 'put',
	path: '/{id}',
	tags: ['Addresses'],
	summary: 'Update a address',
	request: {
		params: AddressesParamsSchema,
		body: jsonBody(AddressUpdateSchema),
	},
	responses: {
		200: jsonOk(AddressSelectSchema),
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const deleteAddressRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Addresses'],
	summary: 'Delete a address',
	request: { params: AddressesParamsSchema },
	responses: {
		204: deletedNoContent,
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const addressesRoute = new OpenAPIHono<AppEnv>();

addressesRoute.openapi(listAddressesRoute, listAddresses);
addressesRoute.openapi(listAddressesCursorRoute, listAddressesCursor);
addressesRoute.openapi(getAddressRoute, getAddress);
addressesRoute.openapi(createAddressRoute, createAddress);
addressesRoute.openapi(updateAddressRoute, updateAddress);
addressesRoute.openapi(deleteAddressRoute, deleteAddress);
