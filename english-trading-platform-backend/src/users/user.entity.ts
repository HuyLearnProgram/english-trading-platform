import { Entity, PrimaryGeneratedColumn, Column,  OneToMany } from 'typeorm';
import { Review } from '../review/review.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  role: string; // 'admin', 'lecturer', 'customer'


  @OneToMany(() => Review, review => review.user)
  reviews: Review[];
}
