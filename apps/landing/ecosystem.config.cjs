module.exports = {
  apps: [
    {
      name: "loadout",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      instances: 1,
      exec_mode: "fork",
      max_restarts: 5,
    },
  ],
};
