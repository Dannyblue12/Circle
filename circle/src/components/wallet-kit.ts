// Stellar Wallets Kit setup. Browser-only: wallet.tsx loads this file with a single
// dynamic import() the first time someone connects or signs.
//
// Keep every kit import in this file. One import() boundary means the browser asks the
// bundler for one chunk (this file) instead of one per wallet module, and changing the
// wallet list only edits this file, so open tabs and hot reload never end up pointing
// at a kit module the bundler no longer serves.
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { HanaModule } from "@creit.tech/stellar-wallets-kit/modules/hana";
import { LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr";
import { RabetModule } from "@creit.tech/stellar-wallets-kit/modules/rabet";
import { VarialModule } from "@creit.tech/stellar-wallets-kit/modules/varial";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";

export type Kit = typeof StellarWalletsKit;

let initialized = false;

/**
 * Stellar wallets only. The kit's defaultModules() (in "modules/utils") also loads a
 * MetaMask module that throws "MetaMask extension not found" when MetaMask isn't
 * installed, so the modules are listed here instead. Varial is the former Freighter.
 */
export function createKit(network: string): Kit {
  if (!initialized) {
    StellarWalletsKit.init({
      modules: [new VarialModule(), new xBullModule(), new AlbedoModule(), new LobstrModule(), new HanaModule(), new RabetModule()],
      network: network as Parameters<Kit["setNetwork"]>[0],
    });
    initialized = true;
  }
  return StellarWalletsKit;
}
