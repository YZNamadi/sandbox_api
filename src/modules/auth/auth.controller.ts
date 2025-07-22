import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(OptionalJwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Sign up a new user and team' })
  @ApiBody({
    schema: {
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
        name: { type: 'string' },
        teamName: { type: 'string' },
        roleName: { type: 'string' },
      },
      required: ['email', 'password', 'name', 'teamName'],
    },
  })
  @ApiResponse({ status: 201, description: 'User created, returns JWT token.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async signup(
    @Body()
    body: {
      email: string;
      password: string;
      name: string;
      teamName: string;
      roleName?: string;
    },
  ) {
    return this.authService.signup(
      body.email,
      body.password,
      body.name,
      body.teamName,
      body.roleName,
    );
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and receive JWT token' })
  @ApiBody({
    schema: {
      properties: { email: { type: 'string' }, password: { type: 'string' } },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Login successful, returns JWT token.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() body: { email: string; password: string }) {
    const result = await this.authService.login(body.email, body.password);
    // If the service returns { access_token: ... }, convert to { token: ... }
    if (result && result.access_token) {
      return { token: result.access_token, user: result.user };
    }
    return result;
  }
}
