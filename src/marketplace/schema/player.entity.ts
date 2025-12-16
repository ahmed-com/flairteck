import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Team } from "./team.entity";
import { DecimalTransformer } from "../transformers/decimal.transformer";
import { Decimal } from "decimal.js";

export enum Position {
  GOALKEEPER = "Goalkeeper",
  DEFENDER = "Defender",
  MIDFIELDER = "Midfielder",
  ATTACKER = "Attacker",
}

@Entity()
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: "enum",
    enum: Position,
    default: Position.MIDFIELDER,
  })
  position: Position;

  @ManyToOne(() => Team, (team) => team.players, {
    eager: true,
    nullable: false,
  })
  team: Team;

  // TODO: teamID

  @Column({ default: false })
  isListed: boolean;

  @Column({
    type: "decimal",
    precision: 20,
    scale: 4,
    unsigned: true,
    nullable: true,
    transformer: new DecimalTransformer(),
  })
  price: Decimal | null;
}
