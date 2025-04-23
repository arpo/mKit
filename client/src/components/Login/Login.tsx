import { TextInput, Button, Paper, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { login, useLoginStore } from "./Script";
import "./Login.css";

export function Login() {
  const [password, setPassword] = useState("");
  const isLoading = useLoginStore((state) => state.isLoading);
  const error = useLoginStore((state) => state.error);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(password);
  };

  return (
    <div className="login-container">
      <Paper w={400} p="xl" radius="md" withBorder>
        <form onSubmit={handleSubmit}>
          <Stack>
            <Text size="lg" fw={500} ta="center">
              Enter password:
            </Text>
            
            <TextInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              error={error}
              disabled={isLoading}
              data-autofocus
            />

            <Button type="submit" loading={isLoading}>
              Submit
            </Button>

            <Text size="sm" c="dimmed" ta="center">
              Questions: hugo@lincmusic.com
            </Text>
          </Stack>
        </form>
      </Paper>
    </div>
  );
}
