"use client";
import { useI18n } from "@bull-and-cow/i18n/react";

import {
  Button,
  Divider,
  EmptyState,
  FormStack,
  GameTitle,
  Note,
  Panel,
  RoomCard,
  RoomList,
  SectionHeading,
  TextField,
} from "@bull-and-cow/ui";
import { GameShell } from "../components/game-ui";
import { useGame } from "../components/game-provider";

export default function Home() {
  const { messages: m } = useI18n();
  const { playerName, setPlayerName, rooms, status, pending, roomId, send } =
    useGame();
  const available = rooms.filter(
    (room) => room.players.length < 2 && room.phase === "waiting",
  );
  const canEnter =
    status === "online" && !!playerName.trim() && !pending && !roomId;

  return (
    <GameShell>
      <GameTitle labels={m.ui.GameTitle} />
      <Panel variant="lobby" aria-label={m.app.lobby}>
        <FormStack>
          <TextField
            label={m.app.name}
            autoComplete="nickname"
            maxLength={32}
            value={playerName}
            disabled={pending || !!roomId}
            placeholder={m.app.namePlaceholder}
            leadingIcon="☺"
            trailingIcon="✎"
            onChange={(event) => setPlayerName(event.target.value)}
          />
          <Button
            disabled={!canEnter}
            loading={pending}
            leadingIcon="＋"
            trailingIcon="→"
            onClick={() =>
              send({
                type: "room.create",
                payload: { playerName: playerName.trim() },
              })
            }
          >
            {pending ? m.app.wait : m.app.create}
          </Button>
        </FormStack>
        <Divider>{m.app.orJoin}</Divider>
        <SectionHeading count={available.length}>{m.app.rooms}</SectionHeading>
        {available.length === 0 ? (
          <EmptyState
            message={status === "online" ? m.app.empty : m.app.searching}
          />
        ) : (
          <RoomList>
            {available.map((room) => (
              <li key={room.id}>
                <RoomCard
                  labels={m.ui.RoomCard}
                  playerName={room.players[0]?.name || ""}
                  disabled={!canEnter}
                  onJoin={() =>
                    send({
                      type: "room.join",
                      payload: {
                        roomId: room.id,
                        playerName: playerName.trim(),
                      },
                    })
                  }
                />
              </li>
            ))}
          </RoomList>
        )}
      </Panel>
      <Note>{m.app.tagline}</Note>
    </GameShell>
  );
}
