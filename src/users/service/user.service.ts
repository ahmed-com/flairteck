import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../schema/user.entity";
import { Repository } from "typeorm";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

type NewUserObject = Omit<User, "id">;
type UserCreatedJobData = {
  userId: number;
  email: string;
};

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectQueue("team") private readonly teamQueue: Queue<UserCreatedJobData>
  ) {}

  async findOne(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async create(user: NewUserObject): Promise<User> {
    const newUser = this.userRepository.create(user);
    const savedUser = await this.userRepository.save(newUser);

    await this.teamQueue.add("userCreated", {
      userId: savedUser.id,
      email: savedUser.email,
    });
    return savedUser;
  }
}
