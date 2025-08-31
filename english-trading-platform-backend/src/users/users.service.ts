import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { AccountStatus, User, UserRole } from './user.entity';
import { CreateUserDto, QueryUsersDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcryptjs';
import { MailService } from 'src/mail/mail.service';

const normalizeRole = (r?: string): UserRole => {
  const k = (r || '').toLowerCase();
  if (k === 'admin') return 'admin';
  if (k === 'teacher' || k === 'lecturer') return 'teacher';
  // customer/student hoặc trống => student
  return 'student';
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly mail: MailService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const { email, password, role, avatarUrl, phone, status } = dto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      role: normalizeRole(role),     
      avatarUrl,
      phone,
      status: status ?? 'visible',
    });

    return this.usersRepository.save(user);
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    if (dto.email != null) user.email = dto.email;
    if (dto.password) user.password = await bcrypt.hash(dto.password, 10);
    if (dto.role != null) user.role = normalizeRole(dto.role); // <<<< chỉ role
    if (dto.avatarUrl != null) user.avatarUrl = dto.avatarUrl;
    if (dto.phone != null) user.phone = dto.phone;
    if (dto.status != null) user.status = dto.status;

    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async findOne(id: number): Promise<User> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async list(q: QueryUsersDto) {
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(100, Math.max(1, q.limit ?? 20));

    const where: FindOptionsWhere<User> = {};
    if (q.emailLike) where.email = Like(`%${q.emailLike}%`);
    if (q.status) where.status = q.status as AccountStatus;
    if (q.role) where.role = normalizeRole(q.role); // <<<< lọc theo role đơn

    const [items, total] = await this.usersRepository.findAndCount({
      where,
      order: { email: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async lockUser(id: number, reason: string) {
    const u = await this.findById(id);
    u.status = 'hidden';
    await this.usersRepository.save(u);

    const pretty = (s: string) => (s?.trim() ? s.trim() : '(không có)');
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    await this.mail.send({
      to: u.email,
      subject: 'Tài khoản của bạn đã bị khóa',
      text: `Tài khoản của bạn đã bị khóa.\nLý do: ${pretty(reason)}`,
      html: `
        <p>Tài khoản của bạn đã bị <b>khóa</b>.</p>
        <p><b>Lý do:</b></p>
        <div style="white-space:pre-line">${esc(pretty(reason))}</div>
      `,
    });

    return u;
  }

  async unlockUser(id: number) {
    const u = await this.findById(id);
    u.status = 'visible';
    await this.usersRepository.save(u);
    return u;
  }
}
