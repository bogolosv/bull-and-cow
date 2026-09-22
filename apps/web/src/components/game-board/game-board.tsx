"use client";
import { useI18n } from "@bull-and-cow/i18n/react";
import { formatCount } from "@bull-and-cow/i18n";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  GameTimer,
  RematchControl,
  GuessRow,
  MatchResult,
  Panel,
  SecretCodeInput,
  SecretCodePreview,
  SurrenderControl,
  TurnIndicator,
} from "@bull-and-cow/ui";
import type { GameState } from "@bull-and-cow/shared";
import { secretCodeSchema } from "@bull-and-cow/shared";
import { useGame } from "../game-provider";
import { useRemainingSeconds } from "../../hooks/use-remaining-seconds";
import styles from "./game-board.module.css";

export function GameBoard({
  game,
  playerId,
}: {
  game: GameState;
  playerId: string;
}) {
  const { messages: m, locale } = useI18n();
  const { send, pending, status, ownSecret, rooms, clockOffset } = useGame();
  const room = rooms.find((r) => r.id === game.roomId);
  const seconds = useRemainingSeconds(game.turnEndsAt, clockOffset);
  const paused =
    status !== "online" ||
    game.turnEndsAt === null ||
    !room?.players.every((p) => p.connected);
  const [guess, setGuess] = useState("");
  const history = useRef<HTMLOListElement>(null);
  const yourTurn = game.turnPlayerId === playerId;
  const canAct = status === "online" && !pending;
  const duplicate = game.attempts.some((attempt) => attempt.code === guess);
  useEffect(() => {
    history.current?.scrollTo({
      top: history.current.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [game.attempts.length]);
  useEffect(() => {
    setGuess("");
  }, [game.attempts.length]);
  const canGuess = canAct && !paused && seconds > 0;
  if (game.winnerId && game.reason)
    return (
      <Panel variant="room">
        <MatchResult
          labels={m.ui.MatchResult}
          won={game.winnerId === playerId}
          reason={game.reason}
          attempts={game.attempts.length}
          attemptsText={formatCount(locale, game.attempts.length, "attempt")}
          disabled={!canAct}
          actions={
            <RematchControl
              labels={m.ui.RematchControl}
              score={`${room?.score[playerId] || 0} : ${Object.entries(
                room?.score || {},
              )
                .filter(([id]) => id !== playerId)
                .reduce((sum, [, wins]) => sum + wins, 0)}`}
              accepted={!!room?.rematchPlayerIds.includes(playerId)}
              opponentAccepted={
                !!room?.rematchPlayerIds.some((id) => id !== playerId)
              }
              available={
                room?.players.length === 2 &&
                room.players.every((p) => p.connected)
              }
              disabled={!canAct}
              onConfirm={() =>
                send({
                  type: "game.rematch",
                  payload: { matchId: game.matchId },
                })
              }
              onExit={() => send({ type: "room.leave" })}
            />
          }
        />
      </Panel>
    );
  return (
    <>
      <Panel variant="room" aria-label={m.app.board}>
        <TurnIndicator
          labels={m.ui.TurnIndicator}
          yourTurn={yourTurn}
          opponentName={game.opponentName}
        />
        <GameTimer
          seconds={paused ? Math.ceil(game.turnRemainingMs / 1000) : seconds}
          paused={paused}
          label={paused ? m.app.paused : m.app.turnTime}
        />
        <div className={styles.historyHeading}>
          <h2>{m.app.attempts}</h2>
          <span>
            {m.app.opponent}{" "}
            {new Intl.NumberFormat(locale).format(game.opponentAttempts)}
          </span>
        </div>
        {game.attempts.length ? (
          <ol
            className={styles.history}
            ref={history}
            aria-label={m.app.history}
          >
            {game.attempts.map((attempt, index) => (
              <li key={attempt.id}>
                <GuessRow
                  labels={m.ui.GuessRow}
                  {...attempt}
                  number={index + 1}
                />
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.empty}>{m.app.firstGuess}</p>
        )}
        <p className={styles.srOnly} role="status">
          {game.attempts.length
            ? `${m.ui.GuessRow.bulls}: ${game.attempts.at(-1)?.bulls}, ${m.ui.GuessRow.cows}: ${game.attempts.at(-1)?.cows}.`
            : ""}
        </p>
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            if (
              yourTurn &&
              canGuess &&
              !duplicate &&
              secretCodeSchema.safeParse(guess).success
            )
              send({
                type: "game.guess",
                payload: {
                  code: guess,
                  revision: game.revision,
                  matchId: game.matchId,
                },
              });
          }}
        >
          <SecretCodeInput
            labels={m.ui.SecretCodeInput}
            label={m.app.guess}
            value={guess}
            onChange={setGuess}
            disabled={!yourTurn || !canGuess}
          />
          {duplicate && (
            <p className={styles.error} role="alert">
              {m.app.duplicate}
            </p>
          )}
          <Button
            type="submit"
            disabled={
              !yourTurn ||
              !canGuess ||
              duplicate ||
              !secretCodeSchema.safeParse(guess).success
            }
            loading={pending}
          >
            {pending ? m.app.checking : yourTurn ? m.app.check : m.app.waitTurn}
          </Button>
        </form>
        {ownSecret && (
          <details className={styles.secret}>
            <summary>{m.app.ownSecret}</summary>
            <SecretCodePreview
              labels={m.ui.SecretCodePreview}
              code={ownSecret}
            />
          </details>
        )}
      </Panel>
      <SurrenderControl
        labels={m.ui.SurrenderControl}
        disabled={!canAct}
        onConfirm={() =>
          send({ type: "game.surrender", payload: { matchId: game.matchId } })
        }
      />
    </>
  );
}
