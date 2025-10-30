/**
 * Editor initialization utilities
 * Sets up file system, workspace, explorer, and command system
 */

import { fsService } from './services/fs.service'
import { workspaceService } from './services/workspace.service'
import { explorerService } from './services/explorer.service'
import { commandManager } from './commands/manager'
import { shellService } from './services/shell.service'

// Command imports - side effects only (they register themselves)
import './commands/implementations/build'
import './commands/implementations/deploy'
import './commands/implementations/test'
import './commands/implementations/clear'
import './commands/implementations/help'
import './commands/implementations/solana'
import './commands/implementations/anchor'
import './commands/implementations/rustfmt'

let isInitialized = false

/**
 * Initialize the editor with all required services and commands
 */
export async function initializeEditor(projectId: string): Promise<void> {
  if (isInitialized) {
    console.log('Editor already initialized')
    return
  }

  try {
    console.log('Initializing editor for project:', projectId)

    // Initialize workspace service
    await workspaceService.init()

    // Check if workspace exists, create if not
    const currentWorkspace = workspaceService.currentName
    
    if (!currentWorkspace || currentWorkspace !== projectId) {
      const workspaceName = `workspace_${projectId}`
      if (!workspaceService.allNames.includes(workspaceName)) {
        await workspaceService.create(workspaceName)
      }
      await workspaceService.switch(workspaceName)
      console.log('✓ Created/switched to workspace:', workspaceName)
    } else {
      console.log('✓ Using workspace:', currentWorkspace)
    }

    // Commands are already registered via imports
    console.log('✓ Commands registered')

    isInitialized = true
    console.log('✅ Editor initialization complete')
  } catch (error) {
    console.error('Failed to initialize editor:', error)
    throw error
  }
}

/**
 * Create default Solana project structure
 */
export async function createDefaultProject(): Promise<void> {
  try {
    // Create basic Solana project structure
    await fsService.createDir('/src')
    await fsService.createDir('/tests')
    
    // Create lib.rs with minimal Solana program
    const libRs = `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
`
    await fsService.writeFile('/src/lib.rs', libRs)
    
    // Create Anchor.toml
    const anchorToml = `[features]
seeds = false
skip-lint = false

[programs.localnet]
my_program = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
`
    await fsService.writeFile('/Anchor.toml', anchorToml)
    
    // Create Cargo.toml
    const cargoToml = `[package]
name = "my-program"
version = "0.1.0"
description = "Created with Anchor"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "my_program"

[dependencies]
anchor-lang = "0.29.0"
`
    await fsService.writeFile('/Cargo.toml', cargoToml)
    
    console.log('✓ Default project structure created')
  } catch (error) {
    console.error('Failed to create default project:', error)
    throw error
  }
}

/**
 * Reset the initialization state (useful for testing)
 */
export function resetInitialization(): void {
  isInitialized = false
}
