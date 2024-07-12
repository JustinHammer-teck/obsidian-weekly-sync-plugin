{
  description = "A Nix-flake-based typescript development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = { self, nixpkgs, ... }@inputs:
    let
      system = "x86_64-darwin";
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShells.x86_64-darwin.default = with pkgs; mkShell {
        name = "javascript dev shell";
        nativeBuildInputs = with pkgs; [
            nodejs_22
            corepack_22
        ];

        shellHook = ''
          echo "hello to javascript dev shell"  
        '';
      };
    };
}
