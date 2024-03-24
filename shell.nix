{ pkgs ? (import <nixpkgs> { 
    config.allowUnfree = true;
}), ... }:

pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    rustup 
    rust-analyzer
    pkg-config
    openssl
    udev
    xorg.libX11
    xorg.libXi
    xorg.libXtst
  ];

  shellHook = ''
    export LD_LIBRARY_PATH=${pkgs.xorg.libX11}/lib:$LD_LIBRARY_PATH
    export LD_LIBRARY_PATH=${pkgs.xorg.libXtst}/lib:$LD_LIBRARY_PATH
    # export LD_LIBRARY_PATH=${pkgs.xorg.libXcursor}/lib:$LD_LIBRARY_PATH
    # export LD_LIBRARY_PATH=${pkgs.xorg.libXrandr}/lib:$LD_LIBRARY_PATH
    # export LD_LIBRARY_PATH=${pkgs.xorg.libXi}/lib:$LD_LIBRARY_PATH
    # export LD_LIBRARY_PATH=${pkgs.vulkan-loader}/lib:$LD_LIBRARY_PATH
  '';
}
