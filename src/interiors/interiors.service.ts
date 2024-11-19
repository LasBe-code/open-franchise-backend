import { Injectable } from '@nestjs/common';
import { GetInteriorReq } from './dto/interior.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { OpenApiResponseDto } from 'src/openApis/dto/openApi.dto';
import { Interior } from './entities/interior.entity';

@Injectable()
export class InteriorsService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}
  private key = this.configService.get<string>('OPENAPI_KEY');
  private endPoint =
    'https://apis.data.go.kr/1130000/FftcBrandFrcsIntInfo2_Service/getbrandFrcsBzmnIntrrctinfo';

  create(data: Interior) {
    try {
      return this.prisma.interior.create({ data });
    } catch (error) {
      throw error;
    }
  }

  async findOne(params: GetInteriorReq) {
    const dbResult = await this.prisma.interior.findUnique({
      where: { brandMnno: params.brandMnno },
    });
    if (dbResult) return dbResult;

    // DB에 없으면 공공데이터 호출 -> 저장 -> return
    let response: Interior;
    response = await this.findOneByOpenApi(params);
    // 해당년도 없으면 전년도 데이터 호출
    if (!response) {
      response = await this.findOneByOpenApi({
        ...params,
        jngBizCrtraYr: +params.jngBizCrtraYr - 1 + '',
      });
    }
    if (!response) return;
    const result = this.create(response);
    result.then((data) => console.log('save interior', data));
    return response;
  }

  async findOneByOpenApi(params: GetInteriorReq) {
    try {
      const response = await this.httpService.axiosRef.get<
        OpenApiResponseDto<Interior>
      >(this.endPoint, {
        params: {
          resultType: 'json',
          serviceKey: this.key,
          pageNo: 1,
          numOfRows: 1,
          ...params,
        },
      });
      const data = response?.data?.items;
      if (data?.length) return data[0];
    } catch (error) {
      throw error;
    }
  }
}
