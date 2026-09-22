"use client";
import { useI18n } from "@bull-and-cow/i18n/react";
import { formatCount } from "@bull-and-cow/i18n";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Countdown,
  LinkButton,
  Mascot,
  Panel,
  PlayerCard,
  PlayerPair,
  RoomHeading,
  StatusArea,
  WaitingDots,
  SecretCodePreview,
  ReadinessIndicator,
} from "@bull-and-cow/ui";
import { useParams } from "next/navigation";
import { useGame } from "../../../components/game-provider";
import { GameShell } from "../../../components/game-ui";

import { GameBoard } from "../../../components/game-board/game-board";

import { SecretSetup } from "../../../components/secret-setup/secret-setup";

export default function RoomPage() {
  const { messages: m, locale } = useI18n();
  const { id } = useParams<{ id: string }>();
  const {
    rooms,
    game,
    ownSecret,
    roomId,
    playerId,
    playerName,
    status,
    loaded,
    pending,
    clockOffset,
    send,
  } = useGame();
  const attemptedJoin = useRef(false);
  const [now, setNow] = useState(0);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const room = rooms.find((entry) => entry.id === id);
  const isMember = roomId === id;

  useEffect(() => {
    if (status !== "online") attemptedJoin.current = false;
    if (
      loaded &&
      status === "online" &&
      !roomId &&
      room &&
      room.players.length < 2 &&
      room.phase === "waiting" &&
      playerName.trim() &&
      !pending &&
      !attemptedJoin.current
    ) {
      attemptedJoin.current = true;
      send({
        type: "room.join",
        payload: { roomId: id, playerName: playerName.trim() },
      });
    }
  }, [loaded, status, roomId, room, id, playerName, pending, send]);

  useEffect(() => {
    if (room?.phase !== "countdown") return;
    const update = () => setNow(Date.now() + clockOffset);
    update();
    const timer = setInterval(update, 100);
    return () => clearInterval(timer);
  }, [clockOffset, room?.phase, room?.startsAt]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (!isMember || !room) {
    const unavailable =
      loaded &&
      (!room ||
        room.players.length >= 2 ||
        room.phase === "playing" ||
        room.phase === "finished" ||
        (!!roomId && roomId !== id));
    return (
      <GameShell room>
        <Panel variant="fallback">
          <Mascot ghost size="medium" />
          <h1>
            {unavailable
              ? m.app.unavailable
              : pending || !loaded
                ? m.app.entering
                : m.app.retry}
          </h1>
          {!unavailable && loaded && !pending && (
            <Button
              disabled={status !== "online" || !playerName.trim()}
              onClick={() =>
                send({
                  type: "room.join",
                  payload: { roomId: id, playerName: playerName.trim() },
                })
              }
            >
              {m.app.join}
            </Button>
          )}
          <LinkButton href="/">{m.app.back}</LinkButton>
        </Panel>
      </GameShell>
    );
  }

  const me = room.players.find((player) => player.id === playerId);
  const opponent = room.players.find((player) => player.id !== playerId);
  const choosing = room.phase === "choosing";
  const counting = room.phase === "countdown";
  if (room.phase === "playing" || room.phase === "finished")
    return (
      <GameShell room>
        <RoomHeading
          labels={m.ui.RoomHeading}
          roomCode={id.slice(0, 6).toUpperCase()}
        >
          {room.phase === "finished" ? m.app.finished : m.app.solve}
        </RoomHeading>
        {game && playerId ? (
          <GameBoard game={game} playerId={playerId} />
        ) : (
          <StatusArea message={m.app.loadingBoard}>
            <WaitingDots />
          </StatusArea>
        )}
      </GameShell>
    );
  const seconds = room.startsAt
    ? Math.max(0, Math.min(5, Math.ceil((room.startsAt - now) / 1000)))
    : 5;
  const progress =
    room.startsAt && now
      ? Math.max(0, Math.min(1, (room.startsAt - now) / 5000))
      : 1;

  return (
    <GameShell room>
      <RoomHeading
        labels={m.ui.RoomHeading}
        roomCode={id.slice(0, 6).toUpperCase()}
      >
        {counting
          ? m.app.getReady
          : choosing
            ? me?.ready
              ? m.app.locked
              : m.app.choose
            : m.app.waiting}
      </RoomHeading>
      <Panel variant="room" aria-label={m.app.room}>
        {choosing ? (
          <>
            {me?.ready && ownSecret ? (
              <>
                <SecretCodePreview
                  labels={m.ui.SecretCodePreview}
                  code={ownSecret}
                />
                <StatusArea message={m.app.waiting}>
                  <WaitingDots />
                </StatusArea>
              </>
            ) : (
              <SecretSetup
                key={id}
                pending={pending}
                onConfirm={(code) =>
                  send({ type: "secret.submit", payload: { code } })
                }
              />
            )}
            <ReadinessIndicator
              labels={m.ui.ReadinessIndicator}
              selfReady={!!me?.ready}
              opponentReady={!!opponent?.ready}
            />
          </>
        ) : (
          <>
            {ownSecret ? (
              <SecretCodePreview
                labels={m.ui.SecretCodePreview}
                code={ownSecret}
              />
            ) : (
              <PlayerPair
                first={
                  <PlayerCard
                    labels={m.ui.PlayerCard}
                    name={me?.name || playerName}
                  />
                }
                second={
                  <PlayerCard
                    labels={m.ui.PlayerCard}
                    name={opponent?.name || m.app.unknownPlayer}
                    kind="cow"
                    state={opponent ? "opponent" : "waiting"}
                  />
                }
              />
            )}
            <StatusArea message={counting ? m.app.starting : m.app.needPlayer}>
              {counting ? (
                <Countdown
                  labels={m.ui.Countdown}
                  label={`${m.ui.Countdown.label} ${formatCount(locale, seconds, "second")}`}
                  seconds={seconds}
                  progress={progress}
                />
              ) : (
                <WaitingDots />
              )}
            </StatusArea>
            {opponent && (
              <ReadinessIndicator
                labels={m.ui.ReadinessIndicator}
                selfReady={!!me?.ready}
                opponentReady={!!opponent.ready}
              />
            )}
          </>
        )}
        {!opponent && (
          <Button variant="soft" onClick={copyInvite}>
            {copied ? m.app.copied : m.app.invite}
          </Button>
        )}
      </Panel>
      <Button
        variant="ghost"
        loading={pending}
        disabled={status !== "online"}
        onClick={() => send({ type: "room.leave" })}
      >
        ← {pending ? m.app.wait : m.app.leave}
      </Button>
    </GameShell>
  );
}
