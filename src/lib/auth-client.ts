"use client"

import type { HttpTypes } from "@medusajs/types"
import { sdk } from "./medusa"

type Customer = HttpTypes.StoreCustomer

export class AuthError extends Error {}

/**
 * Register a new customer with email/password. Returns the created customer
 * record. Throws AuthError if the email is already taken or password rejected.
 */
export async function register(args: {
  email: string
  password: string
  first_name?: string
  last_name?: string
  phone?: string
}): Promise<Customer> {
  let registrationToken: string
  try {
    registrationToken = (await sdk.auth.register("customer", "emailpass", {
      email: args.email,
      password: args.password,
    })) as string
  } catch (err) {
    const message = (err as { message?: string })?.message ?? "Registration failed"
    throw new AuthError(message)
  }

  try {
    const { customer } = await sdk.store.customer.create(
      {
        email: args.email,
        first_name: args.first_name,
        last_name: args.last_name,
        phone: args.phone,
      },
      undefined,
      { Authorization: `Bearer ${registrationToken}` }
    )
    // After creating the customer, the registration_token is no longer needed.
    // Log the user in with the same credentials so subsequent calls are authed.
    await sdk.auth.login("customer", "emailpass", {
      email: args.email,
      password: args.password,
    })
    return customer
  } catch (err) {
    const message = (err as { message?: string })?.message ?? "Could not create customer record"
    throw new AuthError(message)
  }
}

/**
 * Log in with email/password. Token is stored automatically by the SDK
 * (jwtTokenStorageMethod: "local").
 */
export async function login(args: {
  email: string
  password: string
}): Promise<Customer> {
  try {
    const result = (await sdk.auth.login("customer", "emailpass", args)) as
      | string
      | { location: string }
    if (typeof result !== "string" && "location" in result) {
      // Third-party auth flow — not supported in this v1.
      throw new AuthError("Third-party login is not configured.")
    }
    return await getCurrentCustomer()
  } catch (err) {
    if (err instanceof AuthError) throw err
    const message = (err as { message?: string })?.message ?? "Invalid email or password"
    throw new AuthError(message)
  }
}

export async function logout(): Promise<void> {
  try {
    await sdk.auth.logout()
  } catch {
    // Even if the API call fails, the local token is cleared by the SDK.
  }
}

/**
 * Fetch the currently logged-in customer. Throws AuthError if not logged in
 * (or if the stored token is expired/invalid).
 */
export async function getCurrentCustomer(): Promise<Customer> {
  try {
    const { customer } = await sdk.store.customer.retrieve()
    if (!customer) throw new AuthError("Not authenticated")
    return customer
  } catch (err) {
    if (err instanceof AuthError) throw err
    throw new AuthError("Not authenticated")
  }
}

/**
 * Same as getCurrentCustomer but returns null on auth failure instead of
 * throwing. Useful for "am I logged in?" checks in client components.
 */
export async function tryGetCurrentCustomer(): Promise<Customer | null> {
  try {
    return await getCurrentCustomer()
  } catch {
    return null
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await sdk.auth.resetPassword("customer", "emailpass", { identifier: email })
  } catch (err) {
    // Most reset-password endpoints intentionally return 200 even on unknown
    // emails to avoid user enumeration. Treat all responses as success.
    void err
  }
}
