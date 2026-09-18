import { redisClient } from "../config/redis.js";

class BlackListRepository {
  private static instance: BlackListRepository;

  public static getInstance = (): BlackListRepository => {
    if (!BlackListRepository.instance) {
      BlackListRepository.instance = new BlackListRepository();
    }
    return this.instance;
  };

  setKey = async (key: string) => {
    return await redisClient.append("blacklist", key + ",");
  };

  getKey = async (key: string) => {
    const data = await redisClient.get(key);
    return String(data).split(",");
  };
}

export default BlackListRepository;
