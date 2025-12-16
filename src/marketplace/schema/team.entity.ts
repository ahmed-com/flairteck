import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DecimalTransformer } from "../transformers/decimal.transformer";
import Decimal from "decimal.js";
import { User } from "src/users/schema/user.entity";
import { Player } from "./player.entity";

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({
    type: "decimal",
    precision: 20,
    scale: 4,
    default: 0,
    unsigned: true,
    transformer: new DecimalTransformer(),
  })
  budget: Decimal;

  @OneToOne(() => User, { nullable: false })
  @JoinColumn()
  owner: User;

  @Column({ nullable: true })
  ownerId: number;

  @OneToMany(() => Player, (player) => player.team, {
    eager: true,
  })
  players: Player[];
}
